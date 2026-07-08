package com.beike.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.BizException;
import com.beike.platform.common.SecurityUtils;
import com.beike.platform.constant.StageEnum;
import com.beike.platform.dto.PipelinePageDTO;
import com.beike.platform.dto.PipelineSaveDTO;
import com.beike.platform.entity.Pipeline;
import com.beike.platform.entity.PipelineMember;
import com.beike.platform.entity.SysUser;
import com.beike.platform.mapper.PipelineMapper;
import com.beike.platform.mapper.PipelineMemberMapper;
import com.beike.platform.mapper.SysUserMapper;
import com.beike.platform.service.PipelineService;
import com.beike.platform.vo.PipelineMemberVO;
import com.beike.platform.vo.PipelineVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 线索 Service 实现 — 完全不需要关心数据权限。
 * <p>
 * 数据权限由 @DataScope 注解（标注在 Mapper 方法上）+ DataPermissionInterceptor 自动处理，
 * 业务代码零侵入，只需关注纯业务逻辑。
 */
@Service
@RequiredArgsConstructor
public class PipelineServiceImpl implements PipelineService {

    private final PipelineMapper pipelineMapper;
    private final PipelineMemberMapper memberMapper;
    private final SysUserMapper userMapper;

    @Override
    public IPage<PipelineVO> page(PipelinePageDTO dto) {
        // 普通用户只看自己负责的商机
        SecurityUtils.LoginUser loginUser = SecurityUtils.getLoginUser();
        if (loginUser != null && "USER".equals(loginUser.getRoleType())) {
            SysUser user = userMapper.selectById(loginUser.getUserId());
            if (user != null && user.getRealName() != null) {
                dto.setOwner(user.getRealName());
            }
        }
        if (dto.getStage() != null && !dto.getStage().isBlank()) {
            dto.setStage(StageEnum.normalize(dto.getStage()));
        }
        Page<Pipeline> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        IPage<Pipeline> result = pipelineMapper.selectPageWithFilter(page, dto);
        return result.convert(this::toVO);
    }

    @Override
    public PipelineVO detail(Long id) {
        Pipeline pipeline = pipelineMapper.selectById(id);
        if (pipeline == null) throw BizException.notFound("商机");
        return toVO(pipeline);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(PipelineSaveDTO dto) {
        Pipeline pipeline = new Pipeline();
        BeanUtils.copyProperties(dto, pipeline);
        pipeline.setStage(StageEnum.normalize(dto.getStage()));
        pipeline.setWinRate(dto.getWinRate() != null ? dto.getWinRate() : 0);
        pipeline.setIsSea(0);

        // 自动填充负责人所属部门
        Long ownerId = dto.getOwnerId() != null ? dto.getOwnerId() : getCurrentUserId();
        pipeline.setOwnerId(ownerId);
        SysUser owner = userMapper.selectById(ownerId);
        if (owner == null) throw BizException.notFound("负责人");
        pipeline.setDeptId(owner.getDeptId() != null ? owner.getDeptId() : 1L);

        pipelineMapper.insert(pipeline);

        // 写入团队成员
        if (!CollectionUtils.isEmpty(dto.getMemberIds())) {
            saveMembers(pipeline.getId(), dto.getMemberIds());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(PipelineSaveDTO dto, Long id) {
        Pipeline existing = pipelineMapper.selectById(id);
        if (existing == null) throw BizException.notFound("商机");

        Pipeline pipeline = new Pipeline();
        BeanUtils.copyProperties(dto, pipeline);
        pipeline.setId(id);
        if (dto.getStage() != null && !dto.getStage().isBlank()) {
            pipeline.setStage(StageEnum.normalize(dto.getStage()));
        }

        // 如果负责人变了，更新冗余的 dept_id
        if (dto.getOwnerId() != null && !dto.getOwnerId().equals(existing.getOwnerId())) {
            SysUser owner = userMapper.selectById(dto.getOwnerId());
            if (owner != null) pipeline.setDeptId(owner.getDeptId());
        }

        pipelineMapper.updateById(pipeline);

        // 重写团队成员
        memberMapper.delete(
                new LambdaQueryWrapper<PipelineMember>()
                        .eq(PipelineMember::getPipelineId, id)
        );
        if (!CollectionUtils.isEmpty(dto.getMemberIds())) {
            saveMembers(id, dto.getMemberIds());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Pipeline pipeline = pipelineMapper.selectById(id);
        if (pipeline == null) throw BizException.notFound("商机");
        pipelineMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(List<Long> ids) {
        if (CollectionUtils.isEmpty(ids)) throw new BizException("请选择要删除的商机");
        pipelineMapper.deleteBatchIds(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void claim(Long id) {
        Pipeline pipeline = pipelineMapper.selectById(id);
        if (pipeline == null) throw BizException.notFound("商机");
        if (pipeline.getIsSea() != 1) throw new BizException("该商机不在公海，无需认领");

        Long userId = getCurrentUserId();
        SysUser user = userMapper.selectById(userId);

        pipeline.setIsSea(0);
        pipeline.setOwnerId(userId);
        pipeline.setDeptId(user.getDeptId());
        pipelineMapper.updateById(pipeline);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void moveToSea(Long id) {
        Pipeline pipeline = pipelineMapper.selectById(id);
        if (pipeline == null) throw BizException.notFound("商机");
        if (pipeline.getIsSea() == 1) throw new BizException("该商机已在公海中");

        pipeline.setIsSea(1);
        pipeline.setOwnerId(null);
        pipeline.setDeptId(null);
        pipelineMapper.updateById(pipeline);

        // 清除团队成员
        memberMapper.delete(new LambdaQueryWrapper<PipelineMember>()
                .eq(PipelineMember::getPipelineId, id));
    }

    // ========== 内部方法 ==========

    private void saveMembers(Long pipelineId, List<Long> memberIds) {
        for (Long uid : memberIds) {
            PipelineMember pm = new PipelineMember();
            pm.setPipelineId(pipelineId);
            pm.setUserId(uid);
            memberMapper.insert(pm);
        }
    }

    private PipelineVO toVO(Pipeline pipeline) {
        PipelineVO vo = new PipelineVO();
        BeanUtils.copyProperties(pipeline, vo);
        vo.setStage(StageEnum.normalize(pipeline.getStage()));

        // 查询负责人姓名
        SysUser owner = userMapper.selectById(pipeline.getOwnerId());
        vo.setOwnerName(owner != null ? owner.getRealName() : "未知");

        // 查询团队成员
        List<PipelineMember> members = memberMapper.selectByPipelineId(pipeline.getId());
        if (!CollectionUtils.isEmpty(members)) {
            vo.setMembers(members.stream().map(m -> {
                PipelineMemberVO mvo = new PipelineMemberVO();
                mvo.setUserId(m.getUserId());
                mvo.setRole(m.getRole());
                SysUser mu = userMapper.selectById(m.getUserId());
                mvo.setUserName(mu != null ? mu.getRealName() : "未知");
                return mvo;
            }).collect(Collectors.toList()));
        } else {
            vo.setMembers(Collections.emptyList());
        }

        return vo;
    }

    private Long getCurrentUserId() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) return (Long) auth.getPrincipal();
        throw new BizException("无法获取当前用户");
    }
}
