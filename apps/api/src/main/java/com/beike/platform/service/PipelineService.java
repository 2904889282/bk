package com.beike.platform.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.dto.PipelinePageDTO;
import com.beike.platform.dto.PipelineSaveDTO;
import com.beike.platform.vo.PipelineVO;

import java.util.List;

public interface PipelineService {

    /** 分页列表（带数据权限过滤） */
    IPage<PipelineVO> page(PipelinePageDTO dto);

    /** 商机详情 */
    PipelineVO detail(Long id);

    /** 新建商机（含团队成员写入） */
    void create(PipelineSaveDTO dto);

    /** 编辑商机 */
    void update(PipelineSaveDTO dto, Long id);

    /** 单条删除 */
    void delete(Long id);

    /** 批量删除 */
    void batchDelete(List<Long> ids);

    /** 公海认领 */
    void claim(Long id);

    /** 移入公海 */
    void moveToSea(Long id);
}
