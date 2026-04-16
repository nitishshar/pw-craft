@smoke
Feature: pw-craft Angular demo

  @smoke @navigation
  Scenario: Home renders the hero title
    Given I open the application
    Then I should see the heading "pw-craft"

  @navigation
  Scenario: Navigate to products
    Given I open the application
    When I navigate to "products"
    Then I should be on the "products" page
    And I should see the heading "Products"

  @navigation
  Scenario: Navigate to about
    Given I open the application
    When I navigate to "about"
    Then I should be on the "about" page
    And I should see the heading "About Us"

  @navigation
  Scenario: Navigate to form demo
    Given I open the application
    When I navigate to "form-demo"
    Then I should be on the "form-demo" page
    And I should see the heading "Form demo"

  @navigation
  Scenario: Navigate to async demo
    Given I open the application
    When I navigate to "async-demo"
    Then I should be on the "async-demo" page
    And I should see the heading "Async demo"

  @navigation
  Scenario: Navigate to counter demo
    Given I open the application
    When I navigate to "counter-demo"
    Then I should be on the "counter-demo" page
    And I should see the heading "Counter demo"

  @navigation
  Scenario: Navigate to animation demo
    Given I open the application
    When I navigate to "animation-demo"
    Then I should be on the "animation-demo" page
    And I should see the heading "Animation demo"

  @forms
  Scenario: Fill full name on form demo
    Given I open the application
    When I navigate to "form-demo"
    And I fill the full name with "Grace Hopper"
    Then the full name field should contain "Grace Hopper"

  @forms
  Scenario: Submit the demo form successfully
    Given I open the application
    When I navigate to "form-demo"
    And I submit a valid demo form
    Then I should see the form success toast

  @forms
  Scenario: Select a category option
    Given I open the application
    When I navigate to "form-demo"
    And I select category "Billing"
    Then the category value should be "Billing"

  @async
  Scenario: Load async table after delay
    Given I open the application
    When I navigate to "async-demo"
    And I click the "load-table" button
    Then I should see the data table

  @async
  Scenario: Slow API reveals async content
    Given I open the application
    When I navigate to "async-demo"
    And I click the "slow-api" button
    Then I should see the async content

  @async
  Scenario: Background job completes
    Given I open the application
    When I navigate to "async-demo"
    And I click the "start-background-job" button
    Then I should see job status "Completed"

  @counter
  Scenario: Increment the counter
    Given I open the application
    When I navigate to "counter-demo"
    And I click the "increment" button
    Then the counter display should not be "0"

  @counter
  Scenario: Decrement the counter
    Given I open the application
    When I navigate to "counter-demo"
    When I click the "increment" button
    And I click the "decrement" button
    Then the counter display should be "0"

  @animation
  Scenario: Move animation adds completion class
    Given I open the application
    When I navigate to "animation-demo"
    And I click the "trigger-move" button
    Then the animated element should include class "animation-complete"

  @animation
  Scenario: Fade toggle changes opacity class
    Given I open the application
    When I navigate to "animation-demo"
    And I click the "toggle fade" button
    Then the fade element should have fade-out styling

  @a11y
  Scenario: Home page has a single h1
    Given I open the application
    Then there should be exactly one h1

  @a11y
  Scenario: About page exposes a primary heading
    Given I open the application
    When I navigate to "about"
    Then I should see the heading "About Us"

  @navigation
  Scenario: Toolbar includes all primary routes
    Given I open the application
    Then I should see navigation link "Products"
    And I should see navigation link "Form demo"
