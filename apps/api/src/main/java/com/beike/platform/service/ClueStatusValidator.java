package com.beike.platform.service;

import com.beike.platform.common.BizException;
import org.springframework.stereotype.Component;
import java.util.*;

/**
 * 线索状态流转校验器 — v1.5 对齐纪要6类状态
 * 规则：普通/经理仅正向推进，管理员可回退/跳步，已转项目为终态
 * 状态体系：接触 → 沟通 → 提案 → 承接 → 延期/丢失（两周有进展节点）
 */
@Component
public class ClueStatusValidator {

    /** 正向流转映射：from → 允许的 to */
    private static final Map<String, Set<String>> FORWARD_MAP = new LinkedHashMap<>();
    static {
        FORWARD_MAP.put("接触", Set.of("沟通"));
        FORWARD_MAP.put("沟通", Set.of("提案"));
        FORWARD_MAP.put("提案", Set.of("承接", "延期", "丢失"));
        FORWARD_MAP.put("承接", Set.of("延期", "丢失"));
        // 延期可以重启到推进阶段
        FORWARD_MAP.put("延期", Set.of("沟通", "提案"));
        // 丢失可以重启（仅管理员）
        FORWARD_MAP.put("丢失", Set.of("接触", "沟通"));
        // 旧状态兼容映射（向后兼容已存在的线索数据）
        FORWARD_MAP.put("线索接触", Set.of("接触", "沟通", "沟通提案"));
        FORWARD_MAP.put("沟通提案", Set.of("沟通", "提案", "执行测试"));
        FORWARD_MAP.put("执行测试", Set.of("提案", "承接", "已承接", "已延期", "已丢失"));
        FORWARD_MAP.put("已承接",  Set.of("承接"));
        FORWARD_MAP.put("已延期",  Set.of("延期", "沟通提案", "执行测试"));
        FORWARD_MAP.put("已丢失",  Set.of("丢失", "线索接触", "沟通提案"));
        FORWARD_MAP.put("已转项目", Set.of());
    }

    /** 所有有效状态 */
    private static final Set<String> ALL_STATUSES = Set.of(
        "接触", "沟通", "提案", "承接", "延期", "丢失", "已转项目",
        // 旧状态兼容
        "线索接触", "沟通提案", "执行测试", "已承接", "已延期", "已丢失"
    );

    /**
     * 校验状态流转是否合法
     */
    public void validate(String from, String to, boolean isAdmin) {
        // 校验目标状态是否合法
        if (!ALL_STATUSES.contains(to)) {
            throw new BizException("无效的状态值: " + to);
        }

        // 相同状态无需变更
        if (Objects.equals(from, to)) {
            return;
        }

        // 已转项目为终态，禁止任何变更
        if ("已转项目".equals(from)) {
            throw new BizException("已转项目的线索不可修改状态");
        }

        // 正向流转
        Set<String> allowed = FORWARD_MAP.getOrDefault(from, Set.of());
        if (allowed.contains(to)) {
            return; // 通过
        }

        // 管理员可回退/跳步
        if (isAdmin) {
            return;
        }

        String allowedStr = allowed.isEmpty() ? "不可变更" : String.join("、", allowed);
        throw new BizException("状态流转不允许: " + from + "→" + to + "，当前仅可转为: " + allowedStr);
    }
}
