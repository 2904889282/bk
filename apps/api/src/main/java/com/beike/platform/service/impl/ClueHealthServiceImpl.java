package com.beike.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.beike.platform.entity.Clue;
import com.beike.platform.mapper.ClueMapper;
import com.beike.platform.service.ClueHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClueHealthServiceImpl implements ClueHealthService {

    private final ClueMapper clueMapper;

    /** 每日凌晨 02:00 扫描 */
    @Override
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional(rollbackFor = Exception.class)
    public void dailyHealthScan() {
        log.info("[健康度扫描] 开始每日线索健康度扫描");
        // 查询所有未删除且未转换的线索（有跟进时间才有健康度计算意义）
        List<Clue> clues = clueMapper.selectList(
                new LambdaQueryWrapper<Clue>()
                        .eq(Clue::getIsDeleted, 0)
                        .isNotNull(Clue::getLastFollowTime)
        );

        int yellowCount = 0;
        int redCount = 0;

        LocalDateTime now = LocalDateTime.now();
        for (Clue clue : clues) {
            long days = ChronoUnit.DAYS.between(clue.getLastFollowTime(), now);
            String newStatus;
            if (days >= 28) {
                newStatus = "red";
                redCount++;
            } else if (days >= 14) {
                newStatus = "yellow";
                yellowCount++;
            } else {
                newStatus = "normal";
            }

            if (!newStatus.equals(clue.getHealthStatus())) {
                Clue update = new Clue();
                update.setId(clue.getId());
                update.setHealthStatus(newStatus);
                clueMapper.updateById(update);
            }
        }
        log.info("[健康度扫描] 完成: 黄灯={}, 红灯={}", yellowCount, redCount);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recalcHealth(Long clueId) {
        Clue clue = clueMapper.selectById(clueId);
        if (clue == null || clue.getLastFollowTime() == null) return;

        long days = ChronoUnit.DAYS.between(clue.getLastFollowTime(), LocalDateTime.now());
        String newStatus = days >= 28 ? "red" : days >= 14 ? "yellow" : "normal";

        if (!newStatus.equals(clue.getHealthStatus())) {
            Clue update = new Clue();
            update.setId(clueId);
            update.setHealthStatus(newStatus);
            clueMapper.updateById(update);
        }
    }
}
