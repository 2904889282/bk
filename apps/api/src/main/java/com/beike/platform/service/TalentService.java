package com.beike.platform.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.dto.TalentPageDTO;
import com.beike.platform.dto.TalentSaveDTO;
import com.beike.platform.vo.TalentVO;

import java.util.List;

public interface TalentService {

    IPage<TalentVO> page(TalentPageDTO dto);

    TalentVO detail(Long id);

    void create(TalentSaveDTO dto);

    void update(TalentSaveDTO dto, Long id);

    void delete(Long id);

    void batchDelete(List<Long> ids);
}
