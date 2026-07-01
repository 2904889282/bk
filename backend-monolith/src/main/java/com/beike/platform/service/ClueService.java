package com.beike.platform.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.dto.CluePageDTO;
import com.beike.platform.dto.ClueSaveDTO;
import com.beike.platform.entity.Clue;
import com.beike.platform.vo.ClueVO;

import java.math.BigDecimal;
import java.util.List;

public interface ClueService {

    /** 分页列表（支持关键词/状态/等级/承接人/日期筛选） */
    IPage<ClueVO> page(CluePageDTO dto);

    /** 线索详情 */
    ClueVO detail(Long id);

    /** 新增线索 */
    void create(ClueSaveDTO dto);

    /** 编辑线索 */
    void update(ClueSaveDTO dto, Long id);

    /** 单条逻辑删除 */
    void delete(Long id);

    /** 批量逻辑删除 */
    void batchDelete(List<Long> ids);

    /** 线索转项目：事务内原子执行（校验+创建项目+更新线索+留痕） */
    Long convertToProject(Long clueId, String projectName, String projectManager, BigDecimal projectAmount);
}
