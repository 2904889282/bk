package com.beike.platform.controller;

import com.beike.platform.common.Result;
import com.beike.platform.entity.Attachment;
import com.beike.platform.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attachment")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    /**
     * 上传附件
     * POST /api/attachment/upload
     */
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public Result<Attachment> upload(@RequestParam("file") MultipartFile file,
                                     @RequestParam("bizType") String bizType,
                                     @RequestParam("bizId") Long bizId) {
        return Result.success(attachmentService.upload(file, bizType, bizId));
    }

    /**
     * 附件列表
     * GET /api/attachment/{bizType}/{bizId}
     */
    @GetMapping("/{bizType}/{bizId}")
    @PreAuthorize("isAuthenticated()")
    public Result<List<Attachment>> list(@PathVariable String bizType, @PathVariable Long bizId) {
        return Result.success(attachmentService.list(bizType, bizId));
    }

    /**
     * 删除附件
     * DELETE /api/attachment/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> delete(@PathVariable Long id) {
        attachmentService.delete(id);
        return Result.success();
    }
}
