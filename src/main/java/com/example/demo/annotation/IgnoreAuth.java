package com.example.demo.annotation;

import java.lang.annotation.*;

/**
 * 标记在方法上，表示该接口不需要Token验证即可访问
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface IgnoreAuth {
}
