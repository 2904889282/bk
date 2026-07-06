package com.beike.platform.service.impl;

import com.beike.platform.common.BizException;
import com.beike.platform.dto.FollowSaveDTO;
import com.beike.platform.entity.Clue;
import com.beike.platform.entity.ClueFollow;
import com.beike.platform.mapper.ClueFollowMapper;
import com.beike.platform.mapper.ClueMapper;
import com.beike.platform.mapper.SysUserMapper;
import com.beike.platform.service.ClueHealthService;
import com.beike.platform.service.ClueFollowService;
import com.beike.platform.service.ClueStatusValidator;
import com.beike.platform.vo.FollowVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClueFollowServiceImpl implements ClueFollowService {

    private final ClueFollowMapper followMapper;
    private final ClueMapper clueMapper;
    private final SysUserMapper userMapper;
    private final ClueStatusValidator statusValidator;
    private final ClueHealthService healthService;

    @Override
    public List<FollowVO> listByClueId(Long clueId) {
        List<ClueFollow> list = followMapper.selectByClueId(clueId);
        return list.stream().map(this::toVO).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(FollowSaveDTO dto) {
        // 1. 校验线索存在 + 已转项目锁定
        Clue clue = clueMapper.selectById(dto.getClueId());
        if (clue == null) throw BizException.notFound("线索");
        if (clue.getIsConverted() != null && clue.getIsConverted() == 1) {
            throw new BizException("已转项目的线索不可新增跟进记录");
        }
        if (dto.getNextDeadline() != null) {
            long days = ChronoUnit.DAYS.between(LocalDateTime.now().toLocalDate(), dto.getNextDeadline());
            if (days > 14 && !Boolean.TRUE.equals(dto.getConfirmLongInterval())) {
                throw new BizException("下次跟进时间超过14天，请二次确认后再提交");
            }
        }
        if (dto.getNewStatus() != null && !dto.getNewStatus().isBlank()
                && (dto.getStatusChangeReason() == null || dto.getStatusChangeReason().isBlank())) {
            throw new BizException("同步变更状态时必须填写状态变更原因");
        }

        Long userId = getCurrentUserId();
        String userName = getCurrentUserName();

        // 2. 先保存跟进记录
        ClueFollow follow = new ClueFollow();
        BeanUtils.copyProperties(dto, follow);
        follow.setFollowDate(LocalDateTime.now());
        follow.setFollowUserId(userId);
        follow.setFollowUserName(userName);
        followMapper.insert(follow);

        Clue update = new Clue();
        update.setId(clue.getId());
        update.setLastFollowTime(follow.getFollowDate());
        update.setHealthStatus("normal");

        // 3. 如果请求了状态变更，在同一个事务内更新线索状态 + 自动生成状态变更日志
        if (dto.getNewStatus() != null && !dto.getNewStatus().isBlank()
                && !dto.getNewStatus().equals(clue.getClueStatus())) {

            // 3.1 校验状态流转合法性
            boolean isAdmin = isCurrentUserAdmin();
            statusValidator.validate(clue.getClueStatus(), dto.getNewStatus(), isAdmin);

            // 3.2 更新线索状态
            String oldStatus = clue.getClueStatus();
            update.setClueStatus(dto.getNewStatus());

            // 3.3 自动生成「状态变更」类型的跟进记录留痕
            ClueFollow statusLog = new ClueFollow();
            statusLog.setClueId(clue.getId());
            statusLog.setFollowType("状态变更");
            statusLog.setFollowDate(LocalDateTime.now());
            statusLog.setFollowUserId(userId);
            statusLog.setFollowUserName(userName);
            statusLog.setCoreConclusion("状态变更: " + oldStatus + " → " + dto.getNewStatus());
            statusLog.setDetailContent(dto.getStatusChangeReason());
            statusLog.setNewStatus(oldStatus + "→" + dto.getNewStatus());
            statusLog.setFollowUserName(userName);
            followMapper.insert(statusLog);
        }

        clueMapper.updateById(update);
        healthService.recalcHealth(clue.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long followId, FollowSaveDTO dto) {
        ClueFollow existing = followMapper.selectById(followId);
        if (existing == null) throw BizException.notFound("跟进记录");

        // 校验线索未转项目
        Clue clue = clueMapper.selectById(existing.getClueId());
        if (clue != null && clue.getIsConverted() != null && clue.getIsConverted() == 1) {
            throw new BizException("已转项目的线索不可编辑跟进记录");
        }

        // 仅创建人或管理员可编辑
        Long userId = getCurrentUserId();
        if (!existing.getFollowUserId().equals(userId) && !isCurrentUserAdmin()) {
            throw BizException.noPermission();
        }

        ClueFollow follow = new ClueFollow();
        BeanUtils.copyProperties(dto, follow);
        follow.setId(followId);
        follow.setClueId(existing.getClueId()); // 不可修改关联
        followMapper.updateById(follow);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long followId) {
        ClueFollow existing = followMapper.selectById(followId);
        if (existing == null) throw BizException.notFound("跟进记录");

        Clue clue = clueMapper.selectById(existing.getClueId());
        if (clue != null && clue.getIsConverted() != null && clue.getIsConverted() == 1) {
            throw new BizException("已转项目的线索不可删除跟进记录");
        }

        followMapper.deleteById(followId); // 逻辑删除
    }

    // ========== 工具方法 ==========

    private FollowVO toVO(ClueFollow f) {
        FollowVO vo = new FollowVO();
        BeanUtils.copyProperties(f, vo);
        return vo;
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) return (Long) auth.getPrincipal();
        throw new BizException("无法获取当前用户");
    }

    private String getCurrentUserName() {
        var user = userMapper.selectById(getCurrentUserId());
        return user != null ? user.getRealName() : "未知用户";
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equals(ga.getAuthority())) return true;
        }
        return false;
    }
}
