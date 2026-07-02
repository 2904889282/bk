package com.beike.platform.service;

import com.beike.platform.dto.FollowSaveDTO;
import com.beike.platform.vo.FollowVO;
import java.util.List;

public interface ClueFollowService {

    /** 查询线索的跟进记录列表（倒序） */
    List<FollowVO> listByClueId(Long clueId);

    /** 新增跟进记录（含可选的状态变更） */
    void create(FollowSaveDTO dto);

    /** 编辑跟进记录 */
    void update(Long followId, FollowSaveDTO dto);

    /** 逻辑删除跟进记录 */
    void delete(Long followId);
}
