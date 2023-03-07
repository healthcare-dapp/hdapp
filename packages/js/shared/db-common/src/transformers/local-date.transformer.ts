import { LocalDate } from "@js-joda/core";

export const LocalDateTransformer = new class {
    from(value: string): LocalDate {
        const [year, month, day] = value.split("-");
        return LocalDate.of(+year, +month, +day);
    }

    to(value: LocalDate): string {
        return `${value.year()}-${value.month()}-${value.dayOfMonth()}`;
    }
};
