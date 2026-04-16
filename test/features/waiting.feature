Feature: Waiting
  Scenario: Wait for the async data table
    Given I open the application
    When I navigate to the async demo page
    And I click the load table button
    Then the data table should become visible

  Scenario: Wait for the products loading spinner to disappear
    Given I open the application
    When I navigate to the products page
    Then the loading spinner should disappear
    And I should see at least one product card

  Scenario: Wait for slow async network content
    Given I open the application
    When I navigate to the async demo page
    And I click the slow API button
    Then the async content should appear

  Scenario: Wait for counter text to change after increment
    Given I open the application
    When I navigate to the counter demo page
    And I click increment until the counter is greater than 0
    Then the counter display should show a value greater than 0

  Scenario: Wait for animation to complete
    Given I open the application
    When I navigate to the animation demo page
    And I trigger the move animation
    Then the animated element should have the completion class

  Scenario: Wait for Angular to be ready after navigation
    Given I open the application
    When I navigate to the home page explicitly
    Then Angular should be stable

  Scenario: Wait for background job status to reach completed
    Given I open the application
    When I navigate to the async demo page
    And I start the background job
    Then the job status should become "Completed"
