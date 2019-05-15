/**
 * {%= date %}
 */

/** List jshint ignore directives here. **/
/* jshint browser:true */
/* global jQuery:false */
/* global cTemplate:false */

/** List jshint ignore directives here. **/
(function( $ ){

   $.widget( 'ui.{%= name_lower_first_char %}', {
      _invalidateTimeout: 0,

      options: {
      },
      _create: function() {
         this.element.addClass( 'ui-widget-{%= name_lower %}' );
         this.element.template({
            renderOnInit: false,
            template: cTemplate,
            state: {
               widget_name: '{%= name_lower %}'
            },
            beforeRender: $.proxy( this._beforeRender, this ),
            onRender: $.proxy( this._afterRender, this )
         });

         /** 
          * This is how to set a deferred event listener that will automatically
          * be destroyed when the widget is destroyed.
          */
         // this.element.on( 'EVENT.{%= name_lower %}', '.CLASSNAME', {self:this}, this._HANDLERMETHOD );

         /*
          * Make sure render() is always called within the context/scope of
          * this widget.
          */
         this.render = $.proxy( this.render, this );

         // Render this widget ui.
         this.render();
      },// /_create()

      //_setOption: function( option, value ) {
      //   $.Widget.prototype._setOption.apply( this, arguments );
      //
      //   switch( option ) {
      //      default:
      //         return;
      //   }// /switch()
      //},// /setOption()

      _invalidate: function( undefined ) {
         clearTimeout( this._invalidateTimeout );
         this._invalidateTimeout = setTimeout( this.render, 20 );
      },// /_invalidate()

      render: function( undefined ) {
         clearTimeout( this._invalidateTimeout );
         this.element.template( 'render' );
      },// /render()

      /**
       * This method allows you to undo anything that was done during the
       * previous render.
       */
      _beforeRender: function( undefined ) {
      },// /_beforeRender()

      /**
       * This method allows you to initialize widgets, bind events, or do
       * anything else necessary after the new html has been rendered.
       */
      _afterRender: function( undefined ) {
         // Determines the current state variables and methods.
         const oState = this.getState();

         // Trigger an event.
         this._triggerEvent( 'afterRender', { widget:this } );
      },// /_afterRender()

      /**
       * This method allows you to call a method listening to this element
       * only as well as trigger a bubbling event.
       */
      _triggerEvent: function( cType, oData ){
         var fnMethod;
         var cFullEventType = ( this.widgetEventPrefix + cType ).toLowerCase();
         var oEvent = $.Event( cFullEventType );

         switch( cType ){
         case 'anything':
            fnMethod = this.options.onEvent;
            break;

         }// /switch()


         if ( fnMethod ) {
            fnMethod( oEvent, oData );
         }

         //this._trigger( cType, oEvent, oData );
         this.element.trigger( oEvent, oData );
      },// /_triggerEvent()

      /**
       * This is a proxy method that allows you to get the template state.
       */
      getState: function(){
         return this.element.template( 'getState' );
      },// /getState()

      /**
       * This is a proxy method that allows you to change the template state.
       * @param  {object} oState      Object with changed state values.
       * @param  {boolean} lRender   Whether or not to render changes.
       * @param  {boolean} lDiff      Whether or not to check for changes.
       *                         Useful for saving cpu cycles on changes
       *                         that we don't care about.
       */
      setState: function( oState, lRender, lDiff ){
         this.element.template( 'setState', oState, lRender, lDiff );
      },// /setState()

      _destroy: function(){
         // Undo everything.
         this._beforeRender();
         this.element.off( '.{%= name_lower %}' );
         this.element.template( 'destroy' );
         this.element.removeClass( 'ui-widget-{%= name_lower %}' );
      }// /_destroy()
   });

}( jQuery ));
