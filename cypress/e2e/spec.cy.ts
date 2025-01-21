/// <reference types="cypress" />

import { deleteAllData } from "../../src/helper/server"

describe('DataMark', () => {
  const drawRectangleOnCanvas = () => {
    // cy.get("#canvas").eq(1).trigger("mousedown", "topRight")
    // cy.get("#canvas").eq(1).trigger("mouseup", "bottomRight")

    cy.get('.upper-canvas').trigger('mousedown', 'topLeft')
    cy.get('.upper-canvas').trigger('mouseup', 'bottomRight') 
  }


  beforeEach(() => {
    cy.visit('http://localhost:5173/')
    cy.viewport(1920, 1080)
  })

  it('should remove popup when label added', () => {
    deleteAllData()
    // Expect no data.
    cy.get("div").contains(/select a label/i).should('exist')

    const testLabel = "test-label"
    cy.get("#label-input").type(testLabel)
    cy.get("button").contains(/add/i).click()

    cy.get("li").contains(testLabel).click()

    cy.get("div").contains(/select a label/i).should('not.exist')
  })

  it('should upload an image and display it in the image list', () => {
    const filePath = 'test-images/sample-image.jpg'

    cy.get('#image-upload').attachFile(filePath)
  
    cy.get('ul li').should('contain.text', 'sample-image.jpg');

    cy.get('ul li').within(() => {
      // Should be the image url as the src.
      cy.get('img').should('have.attr', 'src')
      cy.get('span').contains("sample-image.jpg").should('exist')
    })
  });
  

  // it('should allow drawing with images and label existing', () => {
  //   // Combining the two tests above, and then simulating drawing rectangle.
  //   // There will be several API calls we need to wait for. 
  //   cy.intercept('POST', 'http://localhost:8080/images').as('createImage');
  //   cy.intercept('GET', 'http://localhost:8080/images/paginated?page=0').as('getFirstPageImages');
  //   cy.intercept('POST', '/api/images/sample-image.jpg/annoatations').as('getSelectedImageAnnotations');
  //   // Adding the label
  //   deleteAllData()
  //   // Expect no data.
  //   cy.get("div").contains(/select a label/i).should('exist')

  //   const testLabel = "test-label"
  //   cy.get("#label-input").type(testLabel)
  //   cy.get("button").contains(/add/i).click()

  //   cy.get("li").contains(testLabel).click()

  //   cy.get("div").contains(/select a label/i).should('not.exist')

  //   // Adding the image
  //   const filePath = 'test-images/sample-image.jpg'

  //   cy.get('#image-upload').attachFile(filePath)

  //   // Wait for the API call to finish
  //   // cy.wait('@createImage') 
  //   //   .its('response.statusCode') 
  //   //   .should('eq', 201); 

  //   // cy.wait('@getFirstPageImages') 
  //   //   .its('response.statusCode') 
  //   //   .should('eq', 200); 
  
  //   cy.get('ul li').should('contain.text', 'sample-image.jpg');

  //   // Drawing rectangle
  //   cy.get('ul li').contains("sample-image.jpg").click()
  //   cy.get("#drawIcon").click()
  //   drawRectangleOnCanvas()

  //   cy.wait('@getSelectedImageAnnotations') 
  //     .its('response.statusCode') 
  //     .should('eq', 200); 
  // })

  it('should allow drawing with images and label existing', () => {
    // Combining the two tests above, and then simulating drawing rectangle.
    // There will be several API calls we need to wait for. 
    cy.intercept('DELETE', '/api/images').as('deleteAll')
    cy.intercept('POST', '/api/images').as('createImage');
    cy.intercept('GET', '/api/images/paginated?page=0').as('getFirstPageImages');
    cy.intercept('POST', '/api/images/sample-image.jpg/annotations').as('postSelectedImageAnnotations'); 
    cy.intercept('GET', '/api/images/sample-image.jpg/annotations').as('getSelectedImageAnnotations'); // Corrected method to GET

    // Adding the label
    deleteAllData()
    cy.wait("@deleteAll")
      .its('response.statusCode')
      .should('eq', 200)
    
    // Expect no data.
    cy.get("div").contains(/select a label/i).should('exist');

    const testLabel = "test-label";
    cy.get("#label-input").type(testLabel);
    cy.get("button").contains(/add/i).click();

    cy.get("li").contains(testLabel).click();

    cy.get("div").contains(/select a label/i).should('not.exist');

    // Adding the image
    const filePath = 'test-images/sample-image.jpg';
    cy.get('#image-upload').attachFile(filePath);

    // Wait for the create image API to finish and check status code 201
    cy.wait('@createImage')
      .its('response.statusCode')
      .should('eq', 201);

    // Ensure image appears in the list
    cy.get('ul li').should('contain.text', 'sample-image.jpg');

    // Drawing rectangle
    cy.get('ul li').contains("sample-image.jpg").click();
    cy.get("#drawIcon").click();

    cy.wait('@getSelectedImageAnnotations')
      .its('response.statusCode')
      .should('eq', 200);

    cy.wait('@getSelectedImageAnnotations')
      .its('response.statusCode')
      .should('eq', 200);

    cy.wait('@getSelectedImageAnnotations')
      .its('response.statusCode')
      .should('eq', 200);

    drawRectangleOnCanvas();

    // Wait for the annotations API to finish and check status code 200
    

    cy.wait('@getSelectedImageAnnotations')
      .its('response.statusCode')
      .should('eq', 200);

    // Wait for the annotations API to finish and check status code 200
    cy.wait('@postSelectedImageAnnotations')
      .its('response.statusCode')
      .should('eq', 200);

    // cy.get('ul li').contains(/annotation0/i).should('exist')

    // Add a slight delay to allow UI update
    cy.wait(500);  // You may want to adjust this based on the actual delay time

    // Verify annotation appears
    // cy.get('ul li').contains("annotation0").should('exist');
    cy.get('h2').contains("sample-image.jpg")

    cy.get('.upper-canvas').click()
    cy.get('ul li').contains(/annotation0/i).should('exist')
  });

})