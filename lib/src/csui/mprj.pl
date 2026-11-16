#!/usr/bin/perl -w

my $pkg = 'csui';
my $phase = 'compile';

sub buildProc() {
  chdir('..') or die $!;
  system 'npm ci --prefer-offline --no-audit --progress=false' and die $!;
  system 'npm run compile' and die $!;
}

# minimum code to include standard output and error in ixmk logs

use IXOS::CustomProject;

my $project = new IXOS::CustomProject(undef, { 'Mode' => [ $pkg ] }, $phase . '_');
$project->RegisterBuildProc( \&buildProc );
$project->Build();
