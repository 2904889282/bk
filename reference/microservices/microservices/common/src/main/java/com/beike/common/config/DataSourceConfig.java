package com.beike.common.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.BlockAttackInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import org.apache.ibatis.session.SqlSessionFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * MySQL 8 读写分离配置
 * - 写操作 → mysql-master:3306
 * - 读操作 → mysql-slave:3307
 */
@Configuration
@EnableTransactionManagement
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.master")
    public DataSource masterDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.slave")
    public DataSource slaveDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public DataSource routingDataSource(DataSource masterDataSource, DataSource slaveDataSource) {
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(DataSourceType.MASTER, masterDataSource);
        targetDataSources.put(DataSourceType.SLAVE, slaveDataSource);

        AbstractRoutingDataSource routing = new AbstractRoutingDataSource() {
            @Override
            protected Object determineCurrentLookupKey() {
                return DataSourceContextHolder.getDataSourceType();
            }
        };
        routing.setDefaultTargetDataSource(masterDataSource);
        routing.setTargetDataSources(targetDataSources);
        routing.afterPropertiesSet();
        return routing;
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource routingDataSource) throws Exception {
        MybatisSqlSessionFactoryBean factory = new MybatisSqlSessionFactoryBean();
        factory.setDataSource(routingDataSource);
        factory.setPlugins(mybatisPlusInterceptor());
        return factory.getObject();
    }

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        // 防全表更新/删除
        interceptor.addInnerInterceptor(new BlockAttackInnerInterceptor());
        return interceptor;
    }

    @Bean
    public PlatformTransactionManager transactionManager(DataSource routingDataSource) {
        return new DataSourceTransactionManager(routingDataSource);
    }
}

/** 数据源类型 */
enum DataSourceType {
    MASTER, SLAVE
}

/** 线程上下文持有数据源类型 */
class DataSourceContextHolder {
    private static final ThreadLocal<DataSourceType> CONTEXT = new ThreadLocal<>();

    public static void setDataSourceType(DataSourceType type) { CONTEXT.set(type); }
    public static DataSourceType getDataSourceType() { return CONTEXT.get() != null ? CONTEXT.get() : DataSourceType.MASTER; }
    public static void clear() { CONTEXT.remove(); }
}
