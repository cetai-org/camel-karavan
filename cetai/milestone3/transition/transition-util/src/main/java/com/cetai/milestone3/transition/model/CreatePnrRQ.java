package com.cetai.milestone3.transition.model;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CreatePnrRQ {

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
