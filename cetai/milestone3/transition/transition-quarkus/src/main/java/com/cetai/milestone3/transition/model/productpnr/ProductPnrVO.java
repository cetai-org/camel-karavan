package com.cetai.milestone3.transition.model.productpnr;

import java.util.Date;
import java.util.List;

public class ProductPnrVO {

    private List<PaxVO> paxVOs;

    private ContactInformationVO ContactInformationVO;

    private List<TravelDocVO> travelDocVOs;

    private String orderid;

    private String offerid;

    private Date creationTime;

    private String posCity;

    

    public List<PaxVO> getPaxVOs() {
        return paxVOs;
    }

    public void setPaxVOs(List<PaxVO> paxVOs) {
        this.paxVOs = paxVOs;
    }

    public ContactInformationVO getContactInformationVO() {
        return ContactInformationVO;
    }

    public void setContactInformationVO(ContactInformationVO contactInformationVO) {
        ContactInformationVO = contactInformationVO;
    }

    public List<TravelDocVO> getTravelDocVOs() {
        return travelDocVOs;
    }

    public void setTravelDocVOs(List<TravelDocVO> travelDocVOs) {
        this.travelDocVOs = travelDocVOs;
    }

    public String getOrderid() {
        return orderid;
    }

    public void setOrderid(String orderid) {
        this.orderid = orderid;
    }

    public String getOfferid() {
        return offerid;
    }

    public void setOfferid(String offerid) {
        this.offerid = offerid;
    }

    public Date getCreationTime() {
        return creationTime;
    }

    public void setCreationTime(Date creationTime) {
        this.creationTime = creationTime;
    }

    public String getPosCity() {
        return posCity;
    }

    public void setPosCity(String posCity) {
        this.posCity = posCity;
    }

    

}
