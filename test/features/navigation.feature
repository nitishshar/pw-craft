Feature: Navigation
  Scenario: Home page loads
    Given I open the application
    Then I should see the home hero title

  Scenario: Navigate to products
    Given I open the application
    When I navigate to the products page
    Then I should see the products heading

  Scenario: Navigate to about
    Given I open the application
    When I navigate to the about page
    Then I should see the about heading

  Scenario: Back and forward navigation
    Given I open the application
    When I navigate to the products page
    And I navigate to the about page
    And I go back in browser history
    Then I should be on the products route
    When I go forward in browser history
    Then I should be on the about route

  Scenario: Query parameters on products
    Given I open the application
    When I open products with query params category "electronics" and sort "price"
    Then the products query param "category" should equal "electronics"
    And the products query param "sort" should equal "price"

  Scenario: Open a route in a new tab
    Given I open the application
    When I open the counter demo in a new tab
    Then I should have at least 2 browser tabs
