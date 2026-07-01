package com.beike.platform.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.dto.ProjectPageDTO;
import com.beike.platform.dto.ProjectSaveDTO;
import com.beike.platform.vo.ProjectVO;
import java.util.List;

public interface ProjectService {
    IPage<ProjectVO> page(ProjectPageDTO dto);
    ProjectVO detail(Long id);
    void create(ProjectSaveDTO dto);
    void update(Long id, ProjectSaveDTO dto);
    void delete(Long id);
    void batchDelete(List<Long> ids);
}
