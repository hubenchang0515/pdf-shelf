/**
 * 逐段编码 URL 路径，保留分隔符 `/`。
 * 用于处理包含 `#`（如 `C#`）、空格、中文等字符的资源路径，
 * 这类路径直接交给 fetch / href 会被 URL 解析器截断或产生歧义。
 */
export function encodePath(value: string): string {
    return value.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}
