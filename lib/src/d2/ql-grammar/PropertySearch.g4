grammar PropertySearch;

/*
 TOKENS
*/

OPEN_PRAN
    : '('
    ;

CLOSE_PRAN
    : ')'
    ;

/*
   Same logic as operators might not be need for these since they don't have a space.
   If ever want to localize these then use generic regex to match the pattern here and then
   while visiting/walking verify AND/OR with english and current locale.
*/

OR
    : [Oo][Rr]
    ;

AND
    : [Aa][Nn][Dd]
    ;


/*
   Adding operators as part of the lexer definition so that we don't need to use quotes since ID uses generic regex to match.
   This is not needed for operator labels without a space since those are matched without quotes as part of ID anyways.
   And we will do validation while visiting/walking the tree since the operators need to be validated based on property.

   If we ever want to localize operators then we need to have separate lexer files for separate locales and then use correct
   grammar during runtime while parsing the tree. The same labels added in grammar should be added in advanced.search.util
   operator label key so that the dropdown will also show the same options.

   In the other language lexers always include english since english operators should always be supported.
*/

OP
    : [Bb][Ee][Gg][Ii][Nn][Ss][ ][Ww][Ii][Tt][Hh] //Begins with
    | [Ee][Nn][Dd][Ss][ ][Ww][Ii][Tt][Hh] //Ends with
    | [Dd][Oo][Ee][Ss][ ][Nn][Oo][Tt][ ][Cc][Oo][Nn][Tt][Aa][Ii][Nn] //Does not contain
    | [Ii][Ss][ ][Nn][Uu][Ll][Ll] //Is null
    | [Ii][Ss][ ][Nn][Oo][Tt][ ][Nn][Uu][Ll][Ll] //Is not null
    ;

ID
    : ~[ \t\n\r"'()]+
    | '"' ('\\"'|.)*? '"'
    | '\'' ('\\\''|.)*? '\''
    ;

WHITESPACE
    : [ \t\n\r]+ -> skip
    ;

/*
PRODUCTION RULES
*/

query
    : statement? EOF
    ;

statement
    : OPEN_PRAN statement CLOSE_PRAN        # parenthesisExpression
    | statement AND statement               # andExpression
    | statement OR statement                # orExpression
    | property operator value               # relationExpression
    | property operator                     # binomialExpression
    ;

property
    : ID
    ;

operator
    : ID
    | OP
    ;

value
    : ID
    ;