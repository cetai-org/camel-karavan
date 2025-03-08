package com.cetai.kamelet.sabreinventory;

public class AdjustInventoryRS {

    private String status;

    private String origin;

    private String destination;

    private String arrivateDateString;

    private String destDateString;

    private boolean eTicket;

    private int flightNumber;

    private String airlineCode;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getArrivateDateString() {
        return arrivateDateString;
    }

    public void setArrivateDateString(String arrivateDateString) {
        this.arrivateDateString = arrivateDateString;
    }

    public String getDestDateString() {
        return destDateString;
    }

    public void setDestDateString(String destDateString) {
        this.destDateString = destDateString;
    }

    public boolean iseTicket() {
        return eTicket;
    }

    public void seteTicket(boolean eTicket) {
        this.eTicket = eTicket;
    }

    public int getFlightNumber() {
        return flightNumber;
    }

    public void setFlightNumber(int flightNumber) {
        this.flightNumber = flightNumber;
    }

    public String getAirlineCode() {
        return airlineCode;
    }

    public void setAirlineCode(String airlineCode) {
        this.airlineCode = airlineCode;
    }



}
