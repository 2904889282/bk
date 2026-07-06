package com.beike.platform.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.BizException;
import com.beike.platform.dto.TalentPageDTO;
import com.beike.platform.dto.TalentSaveDTO;
import com.beike.platform.entity.Talent;
import com.beike.platform.mapper.TalentMapper;
import com.beike.platform.service.TalentService;
import com.beike.platform.vo.TalentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TalentServiceImpl implements TalentService {

    private final TalentMapper talentMapper;

    @Override
    public IPage<TalentVO> page(TalentPageDTO dto) {
        Page<Talent> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        IPage<Talent> result = talentMapper.selectPageWithFilter(page, dto);
        return result.convert(this::toVO);
    }

    @Override
    public TalentVO detail(Long id) {
        Talent talent = talentMapper.selectById(id);
        if (talent == null) throw BizException.notFound("人才");
        return toVO(talent);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(TalentSaveDTO dto) {
        Talent talent = new Talent();
        BeanUtils.copyProperties(dto, talent);
        talentMapper.insert(talent);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(TalentSaveDTO dto, Long id) {
        Talent existing = talentMapper.selectById(id);
        if (existing == null) throw BizException.notFound("人才");

        Talent talent = new Talent();
        BeanUtils.copyProperties(dto, talent);
        talent.setId(id);
        talentMapper.updateById(talent);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Talent talent = talentMapper.selectById(id);
        if (talent == null) throw BizException.notFound("人才");
        talentMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new BizException("请选择要删除的人才");
        talentMapper.deleteBatchIds(ids);
    }

    private TalentVO toVO(Talent talent) {
        TalentVO vo = new TalentVO();
        BeanUtils.copyProperties(talent, vo);
        return vo;
    }
}
