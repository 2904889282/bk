package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

/** 附件表 - biz_attachment */
@Data
@TableName("biz_attachment")
public class Attachment {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String bizType;         // clue/project/follow/risk
    private Long bizId;
    private String fileName;
    private String fileType;        // 文档/图片/音频/其他
    private Long fileSize;
    private String fileUrl;
    private Long uploadUserId;
    private LocalDateTime uploadTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableLogic
    private Integer isDeleted;
}
