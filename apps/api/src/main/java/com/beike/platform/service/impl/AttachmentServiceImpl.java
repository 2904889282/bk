package com.beike.platform.service.impl;

import com.beike.platform.common.BizException;
import com.beike.platform.entity.Attachment;
import com.beike.platform.mapper.AttachmentMapper;
import com.beike.platform.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentMapper attachmentMapper;

    @Value("${beike.upload.dir:./uploads}")
    private String uploadDir;

    /** 允许的文件类型 */
    private static final List<String> ALLOWED_EXT = List.of(
        "jpg","jpeg","png","gif","bmp","webp",          // 图片
        "pdf","doc","docx","xls","xlsx","ppt","pptx",    // 文档
        "mp3","wav","ogg",                                // 音频
        "txt","zip"                                       // 其他
    );
    private static final long MAX_SIZE = 50 * 1024 * 1024; // 50MB

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Attachment upload(MultipartFile file, String bizType, Long bizId) {
        if (file.isEmpty()) throw new BizException("文件不能为空");

        // 文件大小校验
        if (file.getSize() > MAX_SIZE) throw new BizException("文件大小不能超过 50MB");

        // 文件类型校验
        String originalName = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(originalName);
        if (ext == null || !ALLOWED_EXT.contains(ext.toLowerCase())) {
            throw new BizException("不支持的文件类型: " + ext);
        }

        // 存储到本地目录（v1.0 本地存储，v2.0 替换为 MinIO）
        String storedName = UUID.randomUUID() + "." + ext.toLowerCase();
        Path dir = Paths.get(uploadDir, bizType);
        try {
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(storedName));
        } catch (IOException e) {
            throw new BizException("文件存储失败");
        }

        // 确定文件分类
        String fileType = "其他";
        if (List.of("jpg","jpeg","png","gif","bmp","webp").contains(ext.toLowerCase())) fileType = "图片";
        else if (List.of("pdf","doc","docx","xls","xlsx").contains(ext.toLowerCase())) fileType = "文档";
        else if (List.of("mp3","wav","ogg").contains(ext.toLowerCase())) fileType = "音频";

        // 保存记录
        Attachment attachment = new Attachment();
        attachment.setBizType(bizType);
        attachment.setBizId(bizId);
        attachment.setFileName(originalName);
        attachment.setFileType(fileType);
        attachment.setFileSize(file.getSize());
        attachment.setFileUrl("/uploads/" + bizType + "/" + storedName);
        attachment.setUploadTime(LocalDateTime.now());
        attachment.setUploadUserId(getCurrentUserId());
        attachmentMapper.insert(attachment);

        return attachment;
    }

    @Override
    public List<Attachment> list(String bizType, Long bizId) {
        return attachmentMapper.selectByBiz(bizType, bizId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        Attachment att = attachmentMapper.selectById(id);
        if (att == null) throw BizException.notFound("附件");

        // 删除物理文件
        try {
            Path filePath = Paths.get(uploadDir).resolve(att.getFileUrl().replace("/uploads/", ""));
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}

        attachmentMapper.deleteById(id); // 逻辑删除
    }

    private Long getCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) return (Long) auth.getPrincipal();
        return 0L;
    }
}
