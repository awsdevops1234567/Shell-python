import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import {aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_ecr as ecr } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import {aws_logs as logs } from 'aws-cdk-lib';
import { aws_apigatewayv2 as apig } from 'aws-cdk-lib';
import {aws_servicediscovery as servicediscovery } from 'aws-cdk-lib';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  
    // VPC
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'VPC', {
    vpcId: 'vpc-0542842a1764afa86',
    availabilityZones: [ 'us-east-1b', 'us-east-1e'],
    publicSubnetIds: ['subnet-0cf40dd61abebdeaf', 'subnet-066c7b9d3444bdfef'],
      
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
     vpc,
     });
    // Task Role
    const taskrole = new iam.Role(this, "ecsTaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    taskrole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );
    const bookServiceTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "bookServiceTaskDef",
      {
        memoryLimitMiB: 512,
        cpu: 256,
        taskRole: taskrole,
      }
    );
    // Log Groups
    const bookServiceLogGroup = new logs.LogGroup(this, "bookServiceLogGroup", {
      logGroupName: "/ecs/BookService",
    });
    const bookServiceLogDriver = new ecs.AwsLogDriver({
      logGroup: bookServiceLogGroup,
      streamPrefix: "BookService",
    });
    // Amazon ECR Repositories
    const bookservicerepo = ecr.Repository.fromRepositoryName(
      this,
      "bookservice",
      "book-service"
    );
    // Task Containers
    const bookServiceContainer = bookServiceTaskDefinition.addContainer(
      "bookServiceContainer",
      {
        image: ecs.ContainerImage.fromEcrRepository(bookservicerepo),
        logging: bookServiceLogDriver,
      }
    );
    bookServiceContainer.addPortMappings({
      containerPort: 80,
    });
    //Security Groups
    const bookServiceSecGrp = new ec2.SecurityGroup(
      this,
      "bookServiceSecurityGroup",
      {
        allowAllOutbound: true,
        securityGroupName: "bookServiceSecurityGroup",
        vpc: vpc,
      }
    );
    bookServiceSecGrp.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
    // Fargate Services
    const bookService = new ecs.FargateService(this, "bookService", {
      cluster: cluster,
      taskDefinition: bookServiceTaskDefinition,
      assignPublicIp: false,
      desiredCount: 2,
    });
    // ALB
// ALB
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', { vpc, internetFacing: true });
const listener = lb.addListener('Listener', { port: 80 });
bookService.registerLoadBalancerTargets(
  {
    containerName: 'bookServiceContainer',
    containerPort: 80,
    newTargetGroupId: 'ECS',
    listener: ecs.ListenerConfig.applicationListener(listener, {
      protocol: elbv2.ApplicationProtocol.HTTPS
    }),
  },
);
    // ALB Listen
    
  }
}
  
