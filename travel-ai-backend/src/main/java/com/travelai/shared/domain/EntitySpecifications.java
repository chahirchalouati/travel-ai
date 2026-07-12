package com.travelai.shared.domain;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Builds a JPA {@link Specification} for admin list endpoints from a free-text
 * search term plus arbitrary exact/contains field filters.
 *
 * <p>Filter values are coerced to the entity field's declared type via reflection;
 * unknown field names are ignored, so only real persistent attributes are ever
 * queried and callers cannot inject arbitrary paths. String filters use a
 * case-insensitive {@code contains}; everything else uses equality.
 */
public final class EntitySpecifications {

    private EntitySpecifications() {
    }

    /**
     * @param type         entity class (used for reflective type coercion)
     * @param search       free-text term matched against {@code searchFields}
     * @param searchFields string attributes to OR-match the search term against
     * @param filters      field name → raw value; blank values and unknown fields skipped
     */
    public static <T> Specification<T> filter(Class<T> type,
                                              String search,
                                              List<String> searchFields,
                                              Map<String, String> filters) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search) && searchFields != null && !searchFields.isEmpty()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                List<Predicate> ors = new ArrayList<>();
                for (String field : searchFields) {
                    if (fieldType(type, field) == String.class) {
                        ors.add(cb.like(cb.lower(root.get(field)), like));
                    }
                }
                if (!ors.isEmpty()) {
                    predicates.add(cb.or(ors.toArray(new Predicate[0])));
                }
            }

            if (filters != null) {
                for (Map.Entry<String, String> entry : filters.entrySet()) {
                    String field = entry.getKey();
                    String raw = entry.getValue();
                    if (!StringUtils.hasText(raw)) {
                        continue;
                    }
                    Class<?> fieldType = fieldType(type, field);
                    if (fieldType == null) {
                        continue;
                    }
                    if (fieldType == String.class) {
                        predicates.add(cb.like(cb.lower(root.get(field)),
                                "%" + raw.trim().toLowerCase() + "%"));
                    } else {
                        Object coerced = coerce(fieldType, raw.trim());
                        if (coerced != null) {
                            predicates.add(cb.equal(root.get(field), coerced));
                        }
                    }
                }
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Resolves a declared field's type, walking up the superclass chain (e.g. BaseEntity). */
    private static Class<?> fieldType(Class<?> type, String field) {
        Class<?> current = type;
        while (current != null && current != Object.class) {
            try {
                Field f = current.getDeclaredField(field);
                return f.getType();
            } catch (NoSuchFieldException ignored) {
                current = current.getSuperclass();
            }
        }
        return null;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static Object coerce(Class<?> fieldType, String raw) {
        try {
            if (fieldType == Boolean.class || fieldType == boolean.class) return Boolean.valueOf(raw);
            if (fieldType == Integer.class || fieldType == int.class) return Integer.valueOf(raw);
            if (fieldType == Long.class || fieldType == long.class) return Long.valueOf(raw);
            if (fieldType == Short.class || fieldType == short.class) return Short.valueOf(raw);
            if (fieldType == Double.class || fieldType == double.class) return Double.valueOf(raw);
            if (fieldType == Float.class || fieldType == float.class) return Float.valueOf(raw);
            if (fieldType == BigDecimal.class) return new BigDecimal(raw);
            if (fieldType == UUID.class) return UUID.fromString(raw);
            if (fieldType.isEnum()) return Enum.valueOf((Class<Enum>) fieldType, raw);
            return raw;
        } catch (RuntimeException ex) {
            return null;
        }
    }
}
