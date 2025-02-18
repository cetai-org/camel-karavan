package com.cetai.milestone3.transition.model;
public class Bike {
    private String make;
    private String modelNumber;
    private int year;
    private boolean electric;

    public Bike(String make, String modelNumber, int year, boolean electric) {
        this.make = make;
        this.modelNumber = modelNumber;
        this.year = year;
        this.electric = electric;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModelNumber() {
        return modelNumber;
    }

    public void setModelNumber(String modelNumber) {
        this.modelNumber = modelNumber;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public boolean isElectric() {
        return electric;
    }

    public void setElectric(boolean electric) {
        this.electric = electric;
    }

    @Override
    public String toString() {
        return String.join(",", make, modelNumber, String.valueOf(year), String.valueOf(electric));
    }

    public static Bike fromString(String bikeString) {
        final String[] split = bikeString.split(",");
        return new Bike(split[0], split[1], Integer.parseInt(split[2]), Boolean.parseBoolean(split[3]));
    }
}