package com.beike.service.controller;

import com.beike.common.config.SlaveDataSource;
import com.beike.common.security.audit.AuditLog;
import com.beike.service.entity.mysql.Pipeline;
import com.beike.service.entity.es.PipelineDocument;
import com.beike.service.mapper.PipelineMapper;
import com.beike.service.repository.PipelineSearchRepository;
import com.beike.service.service.PipelineImportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/pipelines")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineMapper pipelineMapper;
    private final PipelineSearchRepository searchRepository;
    private final ElasticsearchOperations esOperations;
    private final PipelineImportService importService;

    // ========== MySQL: MyBatis-Plus CRUD ==========

    /** 列表查询 — 走从库 + Redis 缓存 */
    @SlaveDataSource
    @Cacheable(value = "pipelines", key = "'list'")
    @GetMapping
    public List<Pipeline> list() {
        return pipelineMapper.selectList(null);
    }

    /** 创建 — 走主库 + 清除缓存 + 同步 ES */
    @PostMapping
    @CacheEvict(value = "pipelines", allEntries = true)
    public Pipeline create(@RequestBody Pipeline pipeline) {
        pipelineMapper.insert(pipeline);
        // 同步到 Elasticsearch
        PipelineDocument doc = toDocument(pipeline);
        searchRepository.save(doc);
        log.info("管线创建并同步 ES: {}", pipeline.getId());
        return pipeline;
    }

    /** 更新 */
    @PutMapping("/{id}")
    @CacheEvict(value = "pipelines", allEntries = true)
    public Pipeline update(@PathVariable String id, @RequestBody Pipeline pipeline) {
        pipeline.setId(id);
        pipelineMapper.updateById(pipeline);
        searchRepository.save(toDocument(pipeline));
        return pipeline;
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    @CacheEvict(value = "pipelines", allEntries = true)
    public void delete(@PathVariable String id) {
        pipelineMapper.deleteById(id);
        searchRepository.deleteById(id);
    }

    // ========== Elasticsearch: 全文搜索 ==========

    /** IK 分词全文搜索 */
    @GetMapping("/search")
    public List<PipelineDocument> search(@RequestParam String keyword) {
        Criteria criteria = new Criteria("name").matches(keyword)
                .or(new Criteria("client").matches(keyword))
                .or(new Criteria("description").matches(keyword));
        SearchHits<PipelineDocument> hits = esOperations.search(new CriteriaQuery(criteria), PipelineDocument.class);
        return hits.stream().map(SearchHit::getContent).collect(Collectors.toList());
    }

    // ========== Excel 导入 ==========

    /** Excel 导入管线 — 批量创建 + 自动去重 + 错误明细 */
    @PostMapping("/import")
    @CacheEvict(value = {"pipelines", "stats"}, allEntries = true)
    @AuditLog(operation = "IMPORT", targetType = "Pipeline")
    public ResponseEntity<?> importExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("msg", "文件为空"));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.matches(".*\\.xlsx?$")) {
            return ResponseEntity.badRequest().body(Map.of("msg", "仅支持 .xlsx / .xls 格式"));
        }
        try {
            var result = importService.importFromExcel(file);
            return ResponseEntity.ok(Map.of(
                    "success", result.success(), "fail", result.fail(),
                    "skip", result.skip(), "errorCount", result.errors().size()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            log.error("导入管线失败", e);
            return ResponseEntity.internalServerError().body(Map.of("msg", "导入失败: " + e.getMessage()));
        }
    }

    /** 下载导入错误明细 Excel */
    @PostMapping("/import/errors")
    public void downloadErrors(@RequestParam("file") MultipartFile file, HttpServletResponse response) throws Exception {
        var result = importService.importFromExcel(file);
        byte[] excelBytes = importService.generateErrorExcel(result.errors());
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=管线导入错误明细.xlsx");
        response.getOutputStream().write(excelBytes);
        response.getOutputStream().flush();
    }

    /** 下载导入模板 — EasyExcel 动态生成 */
    @GetMapping("/import/template")
    public void downloadTemplate(HttpServletResponse response) throws Exception {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=管线导入模板.xlsx");
        com.alibaba.excel.EasyExcel.write(response.getOutputStream())
                .head(com.beike.service.entity.dto.PipelineExcelDTO.class)
                .sheet("导入模板").doWrite(null);
        response.getOutputStream().flush();
    }

    @SlaveDataSource
    @Cacheable(value = "stats", key = "'pipeline'")
    @GetMapping("/stats")
    public Object stats() {
        return pipelineMapper.countByStage();
    }

    // ========== 辅助 ==========

    private PipelineDocument toDocument(Pipeline p) {
        PipelineDocument doc = new PipelineDocument();
        doc.setId(p.getId());
        doc.setName(p.getName());
        doc.setStage(p.getStage());
        doc.setClient(p.getClient());
        doc.setProduct(p.getProduct());
        doc.setIndustry(p.getIndustry());
        doc.setAmount(p.getAmount());
        doc.setWinRate(p.getWinRate());
        doc.setPriority(p.getPriority());
        doc.setManager(p.getManager());
        doc.setDescription(p.getDescription());
        doc.setNextAction(p.getNextAction());
        doc.setCreatedAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
        doc.setUpdatedAt(p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null);
        return doc;
    }
}
