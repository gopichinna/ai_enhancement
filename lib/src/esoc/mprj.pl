#!/usr/bin/perl

use strict;

use IXOS::BuildSettings;
use IXOS::GruntProject;

#
my $project = new IXOS::GruntProject(
    { 'ReleaseMode' => [ 'Debug', 'Release' ] },
    'esocial-javascript-compile' );
$project->SetTaskToRun( {
 'debug'   => 'debug',
 'release' => 'release'
} );
$project->Build();

