package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.annotation.DataScope;
import com.beike.platform.entity.Pipeline;
import com.beike.platform.dto.PipelinePageDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PipelineMapper extends BaseMapper<Pipeline> {

    /**
     * 分页查询商机列表 — 自动注入数据权限条件
     * <p>
     * 注解含义：主表别名为 p，owner_id = 负责人字段，dept_id = 部门字段，id = 主键
     * handler 通过 MappedStatementId 反射读取此注解，自动生成 WHERE 条件。
     */
    @DataScope(userColumn = "owner_id", deptColumn = "dept_id", pkColumn = "id")
    IPage<Pipeline> selectPageWithFilter(Page<Pipeline> page, @Param("dto") PipelinePageDTO dto);
}
