'use strict';

angular.module('retroman')
  .directive("retroTabs", ['$window', '$compile', '$timeout', function($window, $compile, $timeout) {
    return {
        restrict: 'E',
        link: link,
        templateUrl: 'html/retro-tabs.html'
    }
    
    function link(scope, element, attrs) {      
        function checkTemplateVisible(event) {
            //console.debug("Window visibility check " + $window.innerWidth);
            
             //use $timeout to make sure $apply called in a time manner
             $timeout(function(){

                  //pageYoffset is equal to window scroll top position
                  if($window.innerWidth < 850){
                      scope.includeMobileTemplate = true;
                      scope.includeDesktopTemplate = false;
                  }else{
                      scope.includeMobileTemplate = false;
                      scope.includeDesktopTemplate = true;
                  }
             })

        }

        angular.element($window).on('scroll', checkTemplateVisible)
        angular.element($window).on('resize', checkTemplateVisible)

        function cleanUp() {
          console.debug("retro-tabs cleanup");
          angular.element($window).off('resize', checkTemplateVisible);
          angular.element($window).off('scroll', checkTemplateVisible);
        }
        
        scope.$on('$destroy', cleanUp);
        checkTemplateVisible();
        
        var tabClasses;
  
        function initTabs() {
          tabClasses = ["","","",""];
        }
        
        scope.getTabClass = function (tabNum) {
          return tabClasses[tabNum];
        };
        
        scope.getTabPaneClass = function (tabNum) {
          return "tab-pane " + tabClasses[tabNum];
        }
        
        scope.setActiveTab = function (tabNum) {
          //console.debug("Set Active Tab ", tabNum);
          initTabs();
          tabClasses[tabNum] = "active";
        };
        
        //Initialize 
        initTabs();
        scope.setActiveTab(0);
    }
}]);