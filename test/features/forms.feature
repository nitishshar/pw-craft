Feature: Forms
  Scenario: Fill a required input
    Given I open the application
    When I navigate to the form demo page
    And I fill the full name with "Ada Lovelace"
    Then the full name field should contain "Ada Lovelace"

  Scenario: Fill and submit the demo form
    Given I open the application
    When I navigate to the form demo page
    And I submit a valid demo form
    Then I should see the form success toast

  Scenario: Select an option from the category dropdown
    Given I open the application
    When I navigate to the form demo page
    And I select category "Support"
    Then the category field should show "Support"

  Scenario: Check and uncheck the newsletter checkbox
    Given I open the application
    When I navigate to the form demo page
    And I set the newsletter checkbox to checked
    Then the newsletter checkbox should be checked
    When I set the newsletter checkbox to unchecked
    Then the newsletter checkbox should be unchecked

  Scenario: Select a shipping radio option
    Given I open the application
    When I navigate to the form demo page
    And I select shipping "overnight"
    Then the shipping radio "overnight" should be checked

  Scenario: Drag and drop into the drop zone
    Given I open the application
    When I navigate to the form demo page
    And I drag the first draggable item into the drop zone
    Then the drop zone should contain dragged text

  Scenario: Keyboard navigation focuses the tooltip trigger
    Given I open the application
    When I navigate to the form demo page
    And I tab until the tooltip trigger is focused
    Then the tooltip trigger should be focused

  Scenario: Uploading a file shows the file name
    Given I open the application
    When I navigate to the form demo page
    And I upload a temporary text file
    Then the file name display should not be empty

  Scenario: Validation errors appear for an invalid submit
    Given I open the application
    When I navigate to the form demo page
    And I attempt to submit the form without required fields
    Then I should see a validation error for full name
    And I should see a validation error for email

  Scenario: Slow typing updates the counter step field
    Given I open the application
    When I navigate to the counter demo page
    And I slowly type "3" into the step size field
    Then the step size field should contain "3"
