// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for the "simple editor" tab in the exploration
 * editor.
 */

// Make the last link active when the scroll reaches the bottom of the page.
oppia.value('duScrollBottomSpy', true);
// This indicates that the observed elements are the first ones in their
// respective sections (rather than the entire sections themselves).
oppia.value('duScrollGreedy', true);

oppia.directive('simpleEditorTab', [function() {
  return {
    restrict: 'E',
    templateUrl: 'editor/simpleEditorTab',
    controller: [
      '$scope', '$document', '$rootScope', '$anchorScroll', '$window',
      '$timeout', 'EditorModeService', 'explorationTitleService',
      'duScrollDuration', 'explorationStatesService',
      function(
          $scope, $document, $rootScope, $anchorScroll, $window,
          $timeout, EditorModeService, explorationTitleService,
          duScrollDuration, explorationStatesService) {
        $scope.setEditorModeToFull = EditorModeService.setModeToFull;
        $scope.explorationTitleService = explorationTitleService;
        $scope.fields = [];

        $scope.defaultScrollOffset = Math.max(
          100, $window.innerHeight / 2 - 100);
        $scope.scrollSpyIsActive = true;
        $window.onresize = function() {
          $scope.defaultScrollOffset = Math.max(
            100, $window.innerHeight / 2 - 100);

          // This is needed in order to reset the offsets for the scroll
          // anchors in the sidebar, until
          // https://github.com/oblador/angular-scroll/issues/179 is addressed.
          $scope.scrollSpyIsActive = false;
          $timeout(function() {
            $scope.scrollSpyIsActive = true;
          }, 5);
        };

        $scope.currentScrollId = null;
        $rootScope.$on('duScrollspy:becameActive', function(
            $event, $element, $target) {
          $scope.currentScrollId = $target[0].id;
          $scope.$apply();
        });

        // Scroll the page so that the directive with the given id is in focus.
        var scrollToElement = function(directiveId) {
          $document.scrollToElementAnimated(
            angular.element(document.getElementById(directiveId)),
            $scope.defaultScrollOffset);
        };

        $scope.getLastSeenFieldIndex = function() {
          for (var i = $scope.fields.length - 1; i >= 0; i--) {
            if ($scope.fields[i].isFilledOut() &&
                !$scope.fields[i].isPrefilled) {
              return i;
            }
          }
          // All fields are unseen.
          return -1;
        };

        $scope.getLastSeenFieldId = function() {
          var lastSeenFieldIndex = $scope.getLastSeenFieldIndex();
          if (lastSeenFieldIndex === -1) {
            return null;
          } else {
            return $scope.fields[lastSeenFieldIndex].id;
          }
        };

        $scope.getFirstUnseenFieldId = function() {
          var lastSeenFieldIndex = $scope.getLastSeenFieldIndex();
          if (lastSeenFieldIndex === $scope.fields.length - 1) {
            return null;
          } else {
            return $scope.fields[lastSeenFieldIndex + 1].id;
          }
        };

        // The "go forward" button only appears if you are on the last-filled
        // item on the page, and no subsequent item is filled. Clicking on it
        // navigates to the next field and opens it.
        // If all fields have been filled, then the "go forward" button still
        // appears, and clicking it adds a new question to the stack.
        $scope.goForward = function() {
          var firstUnseenFieldId = $scope.getFirstUnseenFieldId();
          if (firstUnseenFieldId === null) {
            // TODO(sll): Add a new question here, then scroll to it and open
            // its editor.
            return;
          } else {
            // Scroll to the field, and open its editor.
            scrollToElement(firstUnseenFieldId);
            $timeout(function() {
              $scope.$broadcast('externalOpen', firstUnseenFieldId);
            }, duScrollDuration);
          }
        };

        $scope.$on('fieldEditorClosed', function(evt, identifier) {
          evt.stopPropagation();
          for (var i = 0; i < $scope.fields.length; i++) {
            if ($scope.fields[i].id === identifier) {
              // If the field value is not valid, scroll to the next field and,
              // if it is not valid, open it. Otherwise, return without doing
              // anything.
              if ($scope.fields[i].isFilledOut() &&
                  i + 1 < $scope.fields.length) {
                scrollToElement($scope.fields[i + 1].id);
                if (!$scope.fields[i + 1].isFilledOut()) {
                  $timeout(function() {
                    $scope.$broadcast('externalOpen', $scope.fields[i + 1].id);
                  }, duScrollDuration);
                }
              }
              return;
            }
          }
        });

        $scope.$on('refreshStateEditor', function() {
          $scope.initStateEditor();
        });

        $scope.initStateEditor = function() {
          $scope.fields = [{
            id: 'titleId',
            directiveName: 'plaintext-field',
            header: 'What would you like to teach?',
            sidebarLabel: 'Title',
            indentSidebarLabel: false,
            isPrefilled: false,
            enabled: false,
            getInitDisplayedValue: function() {
              return explorationTitleService.displayed;
            },
            isFilledOut: function() {
              return !!explorationTitleService.savedMemento;
            },
            save: function(newValue) {
              explorationTitleService.displayed = newValue;
              explorationTitleService.saveDisplayedValue();
            }
          }, {
            id: 'introId',
            directiveName: 'html-field',
            header: 'Introduction',
            sidebarLabel: 'Introduction',
            indentSidebarLabel: false,
            isPrefilled: false,
            enabled: false,
            getInitDisplayedValue: function() {
              return explorationStatesService.getStateContentMemento(
                'Introduction')[0].value;
            },
            isFilledOut: function() {
              return !!explorationStatesService.getStateContentMemento(
                'Introduction')[0].value;
            },
            save: function(newValue) {
              explorationStatesService.saveStateContent(
                'Introduction', [{
                  type: 'text',
                  value: newValue
                }]
              );
            }
          }, {
            id: 'question1Id',
            directiveName: 'html-field',
            header: 'Question 1',
            sidebarLabel: 'Question 1',
            indentSidebarLabel: false,
            isPrefilled: false,
            enabled: false,
            getInitDisplayedValue: function() {
              return explorationStatesService.getStateContentMemento(
                'Question 1')[0].value;
            },
            isFilledOut: function() {
              return !!explorationStatesService.getStateContentMemento(
                'Question 1')[0].value;
            },
            save: function(newValue) {
              explorationStatesService.saveStateContent(
                'Question 1', [{
                  type: 'text',
                  value: newValue
                }]
              );
            }
          }, {
            id: 'question1InteractionId',
            directiveName: 'interaction-selector',
            header: null,
            sidebarLabel: null,
            indentSidebarLabel: null,
            isPrefilled: true,
            enabled: false,
            getInitDisplayedValue: function() {
              return explorationStatesService.getInteractionIdMemento(
                'Question 1');
            },
            isFilledOut: function() {
              return !!explorationStatesService.getInteractionIdMemento(
                'Question 1');
            },
            save: function(newValue) {
              explorationStatesService.saveInteractionId(
                'Question 1', newValue);
              // TODO(sll): Fire an event to update the prompt, correct answer
              // and hint fields.
            }
          }, {
            id: 'question1Prompt',
            directiveName: 'multiple-choice-prompt',
            header: 'Prompt',
            sidebarLabel: 'Prompt',
            indentSidebarLabel: true,
            isPrefilled: false,
            enabled: false,
            getInitDisplayedValue: function() {
              return explorationStatesService.getInteractionCustomizationArgs(
                'Question 1');
            },
            isFilledOut: function() {
              // TODO
            },
            save: function(newValue) {
              explorationStatesService.saveInteractionCustomizationArgs(
                'Question 1', newValue);
            }
          }, {
            id: 'question1CorrectAnswer',
            directiveName: 'correct-answer-field',
            header: 'Correct Answer',
            sidebarLabel: 'Correct Answer',
            indentSidebarLabel: true,
            isPrefilled: false,
            enabled: false,
            getInitDisplayedValue: function() {
            },
            isFilledOut: function() {
            },
            save: function() {
            }
          }, {
            id: 'question1Hint',
            directiveName: 'hint-field',
            header: 'Hint',
            sidebarLabel: 'Hint',
            indentSidebarLabel: true,
            isPrefilled: false,
            enabled: false,
            getInitDisplayedValue: function() {
            },
            isFilledOut: function() {
            },
            save: function() {
            }
          }];

          // TODO(sll): Generalize this so that it enables more fields
          // depending on what the creator has filled out previously. The code
          // below handles only the "new exploration" case.
          $scope.fields[0].enabled = true;

          // Give the page a little while to load, then scroll so that the first
          // element is in focus.
          $timeout(function() {
            scrollToElement($scope.fields[0].id);
          }, 50);
        };
      }
    ]
  };
}]);
