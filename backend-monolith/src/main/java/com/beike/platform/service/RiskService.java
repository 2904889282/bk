package com.beike.platform.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.dto.RiskPageDTO;
import com.beike.platform.dto.RiskSaveDTO;
import com.beike.platform.vo.RiskVO;

import java.util.List;

public interface RiskService {

    /** 分页列表 */
    IPage<RiskVO> page(RiskPageDTO dto);

    /** 详情 */
    RiskVO detail(Long id);

    /** 新增 */
    void create(RiskSaveDTO dto);

    /** 编辑 */
    void update(RiskSaveDTO dto, Long id);

    /** 逻辑删除 */
    void delete(Long id);

    /** 批量删除 */
    void batchDelete(List<Long> ids);

    /** 标记已解决 */
    void resolve(Long id);
}
