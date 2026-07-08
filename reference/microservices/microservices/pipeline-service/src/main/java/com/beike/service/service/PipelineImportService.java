package com.beike.service.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.read.listener.ReadListener;
import com.beike.service.entity.dto.PipelineExcelDTO;
import com.beike.service.entity.mysql.Pipeline;
import com.beike.service.mapper.PipelineMapper;
import com.beike.service.repository.PipelineSearchRepository;
import com.beike.service.entity.es.PipelineDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineImportService {

    private final PipelineMapper pipelineMapper;
    private final PipelineSearchRepository searchRepository;

    @Value("${beike.pipeline.import.max-rows:1000}")
    private int maxRows;

    @Value("${beike.pipeline.import.skip-on-duplicate:true}")
    private boolean skipOnDuplicate;

    private static final Set<String> VALID_STAGES = Set.of(
            "lead", "verify", "opportunity", "contract", "delivery", "cash", "closed"
    );
    private static final Set<String> VALID_PRODUCTS = Set.of(
            "ai_content", "koc_matrix", "talent_invest", "event_marketing", "quality_dataset"
    );
    private static final Set<String> VALID_INDUSTRIES = Set.of(
            "fin", "edu", "med", "ent", "gov", "tech"
    );
    private static final Set<String> VALID_PRIORITIES = Set.of(
            "urgent", "high", "normal", "low"
    );

    /**
     * 解析并导入线索 Excel
     * @return ImportResult (包含成功/失败统计 + 错误明细)
     */
    @Transactional(rollbackFor = Exception.class)
    public ImportResult importFromExcel(MultipartFile file) throws Exception {
        // 1. 读取 Excel
        List<PipelineExcelDTO> rows = new ArrayList<>();
        EasyExcel.read(file.getInputStream(), PipelineExcelDTO.class, new ReadListener<PipelineExcelDTO>() {
            @Override public void invoke(PipelineExcelDTO dto, AnalysisContext ctx) {
                rows.add(dto);
            }
            @Override public void doAfterAllAnalysed(AnalysisContext ctx) {}
        }).sheet().headRowNumber(1).doRead();

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Excel 文件为空，未检测到数据行");
        }
        if (rows.size() > maxRows) {
            throw new IllegalArgumentException("单次最多导入 " + maxRows + " 行，当前 " + rows.size() + " 行");
        }

        // 2. Excel 内部去重 (name + client)
        Set<String> excelKeys = new HashSet<>();
        List<PipelineExcelDTO> dedupedRows = new ArrayList<>();
        int internalDupCount = 0;
        for (PipelineExcelDTO row : rows) {
            String key = (row.getName() + "|" + row.getClient()).toLowerCase();
            if (excelKeys.contains(key)) {
                internalDupCount++;
                continue;
            }
            excelKeys.add(key);
            dedupedRows.add(row);
        }

        // 3. DB 已有数据去重
        List<PipelineExcelDTO> toCheckRows = dedupedRows;
        if (skipOnDuplicate) {
            List<String> nameClientPairs = toCheckRows.stream()
                    .map(r -> (r.getName() + "|" + r.getClient()).toLowerCase()).distinct().toList();
            Set<String> dbKeys = pipelineMapper.selectList(null).stream()
                    .map(p -> (p.getName() + "|" + p.getClient()).toLowerCase())
                    .collect(Collectors.toSet());
            toCheckRows = toCheckRows.stream()
                    .filter(r -> !dbKeys.contains((r.getName() + "|" + r.getClient()).toLowerCase()))
                    .collect(Collectors.toList());
        }

        // 4. 逐行校验
        List<ImportError> errors = new ArrayList<>();
        List<PipelineExcelDTO> validRows = new ArrayList<>();
        String currentUser = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName() : "system";

        // 获取已有用户列表
        Set<String> existingUsers = pipelineMapper.selectList(null).stream()
                .map(Pipeline::getManager).filter(Objects::nonNull).collect(Collectors.toSet());

        for (int i = 0; i < toCheckRows.size(); i++) {
            PipelineExcelDTO row = toCheckRows.get(i);
            int excelRow = i + 2; // 数据行从第2行开始
            List<String> rowErrors = validateRow(row, existingUsers);
            if (rowErrors.isEmpty()) {
                validRows.add(row);
            } else {
                for (String err : rowErrors) {
                    errors.add(new ImportError(excelRow, row.getName(), row.getClient(), err));
                }
            }
        }

        int dupSkipped = (dedupedRows.size() - toCheckRows.size()); // DB重复
        int skipCount = internalDupCount + dupSkipped;
        int failCount = errors.size();
        int successCount = validRows.size();

        // 5. 批量入库（全部通过才入库）
        if (!validRows.isEmpty()) {
            List<Pipeline> entities = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();
            for (PipelineExcelDTO dto : validRows) {
                Pipeline p = new Pipeline();
                p.setName(dto.getName());
                p.setClient(dto.getClient());
                p.setProduct(dto.getProduct() != null ? dto.getProduct().trim() : null);
                p.setIndustry(dto.getIndustry() != null ? dto.getIndustry().trim() : null);
                p.setStage(dto.getStage() != null ? dto.getStage().trim() : "lead");
                p.setAmount(parseDouble(dto.getAmount()));
                p.setWinRate(parseInt(dto.getWinRate(), 0));
                p.setPriority(dto.getPriority() != null ? dto.getPriority().trim() : "normal");
                p.setManager(dto.getManager() != null ? dto.getManager().trim() : null);
                p.setSource(dto.getSource());
                p.setDescription(dto.getDescription());
                p.setNextAction(dto.getNextAction());
                p.setCreatedAt(now);
                p.setUpdatedAt(now);
                p.setCreatedBy(currentUser);
                entities.add(p);
            }
            // 逐条插入 (MyBatis-Plus BaseMapper 单条 insert, @Transactional 保障原子性)
            for (Pipeline p : entities) {
                pipelineMapper.insert(p);
            }

            // 同步 ES
            for (Pipeline p : entities) {
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
                searchRepository.save(doc);
            }
        }

        log.info("线索导入完成: 成功{}条, 失败{}条, 跳过{}条, 操作人: {}", successCount, failCount, skipCount, currentUser);
        return new ImportResult(successCount, failCount, skipCount, errors);
    }

    /**
     * 生成错误明细 Excel (字节流)
     */
    public byte[] generateErrorExcel(List<ImportError> errors) {
        if (errors.isEmpty()) return new byte[0];
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        EasyExcel.write(os, ErrorRow.class).sheet("错误明细").doWrite(
                errors.stream().map(e -> {
                    ErrorRow er = new ErrorRow();
                    er.setRowNum(e.rowNum);
                    er.setName(e.name);
                    er.setClient(e.client);
                    er.setReason(e.reason);
                    return er;
                }).toList()
        );
        return os.toByteArray();
    }

    // ============ 校验逻辑 ============
    private List<String> validateRow(PipelineExcelDTO row, Set<String> existingUsers) {
        List<String> errs = new ArrayList<>();

        if (isEmpty(row.getName())) errs.add("线索名称为必填");
        else if (row.getName().length() > 128) errs.add("线索名称过长(>128)");

        if (isEmpty(row.getClient())) errs.add("客户名称为必填");
        else if (row.getClient().length() > 128) errs.add("客户名称过长(>128)");

        if (isEmpty(row.getProduct())) errs.add("产品线为必填");
        else if (!VALID_PRODUCTS.contains(row.getProduct().trim())) errs.add("产品线无效: " + row.getProduct());

        if (isEmpty(row.getIndustry())) errs.add("行业为必填");
        else if (!VALID_INDUSTRIES.contains(row.getIndustry().trim())) errs.add("行业无效: " + row.getIndustry());

        if (isEmpty(row.getStage())) errs.add("阶段为必填");
        else if (!VALID_STAGES.contains(row.getStage().trim())) errs.add("阶段无效: " + row.getStage());

        if (isEmpty(row.getAmount())) errs.add("预计金额为必填");
        else {
            try {
                double amt = Double.parseDouble(row.getAmount().trim());
                if (amt <= 0) errs.add("金额必须>0");
            } catch (NumberFormatException e) { errs.add("金额格式错误"); }
        }

        if (!isEmpty(row.getWinRate())) {
            try {
                int wr = Integer.parseInt(row.getWinRate().trim());
                if (wr < 0 || wr > 100) errs.add("赢单率需0-100之间");
            } catch (NumberFormatException e) { errs.add("赢单率格式错误"); }
        }

        if (!isEmpty(row.getPriority()) && !VALID_PRIORITIES.contains(row.getPriority().trim())) {
            errs.add("优先级无效: " + row.getPriority());
        }

        if (isEmpty(row.getManager())) errs.add("负责人为必填");

        if (row.getDescription() != null && row.getDescription().length() > 500) errs.add("描述过长(>500)");
        if (row.getNextAction() != null && row.getNextAction().length() > 256) errs.add("下一步行动过长(>256)");

        return errs;
    }

    private boolean isEmpty(String s) { return s == null || s.trim().isEmpty(); }
    private Double parseDouble(String s) { try { return s != null ? Double.parseDouble(s.trim()) : 0.0; } catch (Exception e) { return 0.0; } }
    private Integer parseInt(String s, int def) { try { return s != null ? Integer.parseInt(s.trim()) : def; } catch (Exception e) { return def; } }

    // ============ 内部类 ============
    public record ImportResult(int success, int fail, int skip, List<ImportError> errors) {}

    public record ImportError(int rowNum, String name, String client, String reason) {}

    @Data
    public static class ErrorRow {
        @com.alibaba.excel.annotation.ExcelProperty("行号")
        private int rowNum;
        @com.alibaba.excel.annotation.ExcelProperty("线索名称")
        private String name;
        @com.alibaba.excel.annotation.ExcelProperty("客户名称")
        private String client;
        @com.alibaba.excel.annotation.ExcelProperty("错误原因")
        private String reason;
    }
}
