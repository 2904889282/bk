package com.beike.platform.service;

/**
 * 线索健康度自动计算服务
 * - 每日定时任务扫描 last_follow_time
 * - 每次新增跟进记录时自动重置并重算
 */
public interface ClueHealthService {

    /** 扫描所有线索并更新健康度（定时任务调用） */
    void dailyHealthScan();

    /** 跟进后重新计算单条线索健康度 */
    void recalcHealth(Long clueId);
}
