package com.beike.platform.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 战役看板聚合数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CampaignDashboardVO {
    private int targetCount;         // 目标线索数
    private int addedCount;          // 已新增
    private double validRate;        // 有效线索率
    private double conversionRate;   // 商机转化率
    private int keyFollowCount;      // 重点跟进数

    // 辅助标签
    private int newClueCount;        // 新增线索数
    private int pendingReviewCount;  // 待评审
    private int yellowWarningCount;  // 黄灯超期
    private int redWarningCount;     // 红灯超期
    private int expectedThisWeek;    // 本周预计转商机
}
