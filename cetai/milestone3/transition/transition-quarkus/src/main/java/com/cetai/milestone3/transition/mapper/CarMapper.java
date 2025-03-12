package com.cetai.milestone3.transition.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.cetai.milestone3.transition.model.Bike;
import com.cetai.milestone3.transition.model.Car;
import com.cetai.milestone3.transition.model.Vehicle;

@Mapper
public interface CarMapper {
    @Mapping(source = "company", target = "brand")
    @Mapping(source = "name", target = "model")
    @Mapping(source = "power", target = "electric")
    Car toCar(Vehicle vehicle);

    @Mapping(source = "make", target = "brand")
    @Mapping(source = "modelNumber", target = "model")
    @Mapping(source = "electric", target = "electric")
    Car toCar(Bike bike);
}