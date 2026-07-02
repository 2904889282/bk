package com.beike.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.entity.Project;
import com.beike.platform.dto.ProjectPageDTO;
import org.apache.ibatis.annotations.*;

@Mapper
public interface ProjectMapper extends BaseMapper<Project> {

    IPage<Project> selectPageWithFilter(Page<Project> page, @Param("dto") ProjectPageDTO dto);

    @Select("SELECT * FROM biz_project WHERE is_deleted = 1 ORDER BY update_time DESC")
    IPage<Project> selectDeletedPage(Page<Project> page);

    @Update("UPDATE biz_project SET is_deleted = 0, update_time = NOW() WHERE id = #{id}")
    void restoreById(Long id);

    @Delete("DELETE FROM biz_project WHERE id = #{id}")
    void permDeleteById(Long id);
}
