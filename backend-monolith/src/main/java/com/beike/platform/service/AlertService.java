package com.beike.platform.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.beike.platform.dto.AlertPageDTO;
import com.beike.platform.dto.AlertSaveDTO;
import com.beike.platform.vo.AlertVO;

import java.util.List;

public interface AlertService {

    IPage<AlertVO> page(AlertPageDTO dto);

    AlertVO detail(Long id);

    void create(AlertSaveDTO dto);

    void update(AlertSaveDTO dto, Long id);

    void delete(Long id);

    void batchDelete(List<Long> ids);

    void resolve(Long id);
}
