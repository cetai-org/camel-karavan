package com.cetai.milestone3.transition.model;

public class CreatePnrRQ {

    private POSType pos;

    private OrderCreateRequestType request;

    private String requestString;

    public String getRequestString() {
        return requestString;
    }

    public void setRequestString(String requestString) {
        this.requestString = requestString;
    }

    @Override
    public String toString() {
        return "CreatePnrRQ [requestString=" + requestString + "]";
    }

    
}
