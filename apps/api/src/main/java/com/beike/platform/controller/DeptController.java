package com.beike.platform.controller;

import com.beike.platform.common.Result;
import com.beike.platform.mapper.SysDeptMapper;
import com.beike.platform.mapper.SysUserMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 部门 / 用户下拉列表 API — 供前端承接人、承接部门等下拉组件使用
 */
@RestController
@RequestMapping("/api/dept")
@RequiredArgsConstructor
public class DeptController {

    private final SysDeptMapper deptMapper;
    private final SysUserMapper userMapper;

    /** 部门列表（供下拉使用） */
    @GetMapping("/list")
    public Result<List<DeptOption>> list() {
        List<DeptOption> list = deptMapper.selectList(null).stream()
                .map(d -> new DeptOption(d.getId(), d.getName()))
                .collect(Collectors.toList());
        return Result.success(list);
    }

    /** 用户简易列表（供承接人下拉使用），返回 username + realName + deptId */
    @GetMapping("/users")
    public Result<List<UserOption>> users() {
        List<UserOption> list = userMapper.selectList(null).stream()
                .filter(u -> u.getStatus() == 1)
                .map(u -> {
                    String label = u.getRealName() != null
                            ? u.getRealName() + " (" + u.getUsername() + ")"
                            : u.getUsername();
                    return new UserOption(u.getId(), u.getUsername(), u.getRealName(), label, u.getDeptId());
                })
                .collect(Collectors.toList());
        return Result.success(list);
    }

    @Data
    public static class DeptOption {
        private final Long id;
        private final String name;
    }

    @Data
    public static class UserOption {
        private final Long id;
        private final String username;
        private final String realName;
        private final String label;
        private final Long deptId;
    }
}
