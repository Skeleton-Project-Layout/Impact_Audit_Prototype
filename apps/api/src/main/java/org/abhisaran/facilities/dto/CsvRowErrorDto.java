package org.abhisaran.facilities.dto;

public class CsvRowErrorDto {
    private int rowNumber;
    private String field;
    private String message;

    public CsvRowErrorDto() {
    }

    public CsvRowErrorDto(int rowNumber, String field, String message) {
        this.rowNumber = rowNumber;
        this.field = field;
        this.message = message;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int rowNumber;
        private String field;
        private String message;

        public Builder rowNumber(int rowNumber) { this.rowNumber = rowNumber; return this; }
        public Builder field(String field) { this.field = field; return this; }
        public Builder message(String message) { this.message = message; return this; }

        public CsvRowErrorDto build() {
            return new CsvRowErrorDto(rowNumber, field, message);
        }
    }

    public int getRowNumber() { return rowNumber; }
    public void setRowNumber(int rowNumber) { this.rowNumber = rowNumber; }
    public String getField() { return field; }
    public void setField(String field) { this.field = field; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
