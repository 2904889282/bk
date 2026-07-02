package com.beike.platform.common;

import lombok.Getter;

@Getter
public class BizException extends RuntimeException {
    private final int code;

    public BizException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BizException(String message) {
        this(400, message);
    }

    public static BizException notFound(String resource) {
        return new BizException(404, resource + "不存在");
    }

    public static BizException noPermission() {
        return new BizException(403, "无操作权限");
    }
}
