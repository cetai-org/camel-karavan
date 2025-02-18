package com.cetai.milestone3.transition.model;


public class Car {
    private String brand;
    private String model;
    private int year;
    private boolean electric;

    public Car() {
        
    }
    public Car(String brand, String model, int year, boolean electric) {
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.electric = electric;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
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
        return String.join(",", brand, model, String.valueOf(year), String.valueOf(electric));
    }

    public static Car fromString(String carString) {
        final String[] split = carString.split(",");
        return new Car(split[0], split[1], Integer.parseInt(split[2]), Boolean.parseBoolean(split[3]));
    }
}