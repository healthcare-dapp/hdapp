import {
    DateTimeFormatter,
    Duration,
    Instant,
    LocalDate,
    LocalDateTime,
    LocalTime,
    TemporalAccessor,
    ZoneId
} from "@js-joda/core";
import "@js-joda/timezone"; // Just needs to be imported; registers itself automatically
import { Locale } from "@js-joda/locale_en-us"; // Get `Locale` from the prebuilt package of your choice

declare class StrictTemporalFormatter<T extends TemporalAccessor> {
    format(temporal: T): string;
}

// DateTimeFormatter is not typesafe (it relies on TemporalAccessor, which can be anything, even unformattable)
// so we downgrading it to "safer" type which only accepts values it really can format
export const temporalFormats = {
    MMMdd: DateTimeFormatter.ofPattern("MMM dd").withLocale(Locale.US) as StrictTemporalFormatter<LocalDate | LocalDateTime>,
    MMMddyyyy: DateTimeFormatter.ofPattern("MMM dd, yyyy").withLocale(Locale.US) as StrictTemporalFormatter<LocalDate | LocalDateTime>,
    ddMM: DateTimeFormatter.ofPattern("dd.MM").withLocale(Locale.US) as StrictTemporalFormatter<LocalDate | LocalDateTime>,
    ddMMyyyy: DateTimeFormatter.ofPattern("dd.MM.yyyy").withLocale(Locale.US) as StrictTemporalFormatter<LocalDate | LocalDateTime>,
    ddMMyyyyHHmm: DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withLocale(Locale.US) as StrictTemporalFormatter<LocalDateTime>,
    ddMMyyyyHHmmss: DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss").withLocale(Locale.US) as StrictTemporalFormatter<LocalDateTime>,
    HHmm: DateTimeFormatter.ofPattern("HH:mm").withLocale(Locale.US) as StrictTemporalFormatter<LocalDateTime | LocalTime>,
    HHmmss: DateTimeFormatter.ofPattern("HH:mm:ss").withLocale(Locale.US) as StrictTemporalFormatter<LocalDateTime | LocalTime>,
};

type FormattableTemporal = LocalDateTime | LocalDate | LocalTime;

export function formatTemporal(temporal?: null | LocalDateTime | Instant, format?: StrictTemporalFormatter<LocalDateTime>): string;
export function formatTemporal(temporal?: null | LocalDate, format?: StrictTemporalFormatter<LocalDate>): string;
export function formatTemporal(temporal?: null | LocalTime, format?: StrictTemporalFormatter<LocalTime>): string;
export function formatTemporal(temporal?: null | Duration): string;
export function formatTemporal<T extends FormattableTemporal>(
    temporal?: null | T | Instant | Duration,
    format?: StrictTemporalFormatter<T>
): string {
    if (!temporal) return "";
    if (temporal instanceof Duration) {
        return `${temporal.toHours().toString().padStart(2, "0")}:${temporal.toMinutes().toString().padStart(2, "0")}:${(temporal.seconds() % 60).toString().padStart(2, "0")}.00`;
    }

    const local: TemporalAccessor = temporal instanceof Instant
        ? LocalDateTime.ofInstant(temporal, ZoneId.systemDefault())
        : temporal;

    const suitableFormat = format
        ?? (local instanceof LocalDate ? temporalFormats.ddMMyyyy : undefined)
        ?? (local instanceof LocalTime ? temporalFormats.HHmm : undefined)
        ?? temporalFormats.ddMMyyyyHHmm;
    console.log(suitableFormat, local);

    return (suitableFormat as DateTimeFormatter).format(local);
}
