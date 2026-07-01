package com.beike.platform.service;

import com.beike.platform.entity.Attachment;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface AttachmentService {
    Attachment upload(MultipartFile file, String bizType, Long bizId);
    List<Attachment> list(String bizType, Long bizId);
    void delete(Long id);
}
