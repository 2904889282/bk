package com.beike.platform.constant;

import java.util.Arrays;
import java.util.Locale;

public enum StageEnum {
    LEAD("lead", "线索"),
    VERIFY("verify", "验证"),
    OPPORTUNITY("opportunity", "机会点"),
    CONTRACT("contract", "合同"),
    DELIVERY("delivery", "交付"),
    CASH("cash", "回款"),
    CLOSED_LOST("closed_lost", "输单");

    private final String code;
    private final String label;

    StageEnum(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String getCode() {
        return code;
    }

    public String getLabel() {
        return label;
    }

    public static StageEnum fromCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String normalized = normalizeCode(code);
        return Arrays.stream(values())
                .filter(stage -> stage.code.equals(normalized))
                .findFirst()
                .orElse(null);
    }

    public static String normalize(String code) {
        if (code == null || code.isBlank()) {
            return LEAD.code;
        }
        String normalized = normalizeCode(code);
        StageEnum stage = fromCode(normalized);
        return stage == null ? normalized : stage.code;
    }

    private static String normalizeCode(String code) {
        String normalized = code.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "initial" -> LEAD.code;
            case "requirement" -> VERIFY.code;
            case "proposal" -> OPPORTUNITY.code;
            case "negotiation" -> CONTRACT.code;
            case "won" -> CASH.code;
            case "lost", "closed" -> CLOSED_LOST.code;
            default -> normalized;
        };
    }
}
