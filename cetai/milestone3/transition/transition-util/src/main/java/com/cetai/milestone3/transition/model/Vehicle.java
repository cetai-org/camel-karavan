package com.cetai.milestone3.transition.model;


public class Vehicle {
    private String company;
    private String name;
    private String power;
    private int year;

    public Vehicle() {
        
    }
    public Vehicle(String company, String name, String power, int year) {
        this.company = company;
        this.name = name;
        this.power = power;
        this.year = year;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPower() {
        return power;
    }

    public void setPower(String power) {
        this.power = power;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    @Override
    public String toString() {
        return String.join(",", company, name, power, String.valueOf(year));
    }

    public static Vehicle fromString(String vehicleString) {
        final String[] split = vehicleString.split(",");
        return new Vehicle(split[0], split[1], split[2], Integer.parseInt(split[3]));
    }
}