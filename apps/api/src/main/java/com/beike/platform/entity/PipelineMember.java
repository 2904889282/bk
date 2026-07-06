package com.beike.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("biz_pipeline_member")
public class PipelineMember {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long pipelineId;        // 商机ID
    private Long userId;            // 团队成员ID
    private String role;            // 角色(如: 售前支持/商务协助)
}
