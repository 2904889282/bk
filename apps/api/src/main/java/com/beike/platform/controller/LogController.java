package com.beike.platform.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.beike.platform.common.Result;
import com.beike.platform.mapper.SysUserMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/log")
@RequiredArgsConstructor
public class LogController {

    private final SysUserMapper userMapper;

    @Data public static class LogPageDTO { private Integer pageNum=1; private Integer pageSize=15; private String userName; private String action; private String dateFrom; private String dateTo; }

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:log')")
    public Result<IPage<Map<String, Object>>> page(LogPageDTO dto) {
        return Result.success(userMapper.selectLogPage(
                new Page<>(dto.getPageNum(), dto.getPageSize()), dto.getUserName(), dto.getAction(), dto.getDateFrom(), dto.getDateTo()));
    }
}
